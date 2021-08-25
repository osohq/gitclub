module Fetcher
  def self.included(base)
    base.class_eval do
      param = lambda do |c|
        if c.field.nil?
          { primary_key => c.value.send(primary_key) }
        else
          { c.field => c.value }
        end
      end

      kinds = Hash.new { |k| raise "Unsupported constraint kind: #{k}" }
      kinds['Eq'] = kinds['In'] = ->(q, c) { q.where param[c] }
      kinds['Neq'] = ->(q, c) { q.where.not param[c] }

      base.define_singleton_method(:fetch) do |cons|
        cons.reduce(all) { |q, con| kinds[con.kind][q, con] }
      end
    end
  end
end
